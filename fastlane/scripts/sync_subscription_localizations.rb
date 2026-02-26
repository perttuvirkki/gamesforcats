require "json"
require "spaceship"
require "fastlane_core/ui/ui"

UI = FastlaneCore::UI unless defined?(UI)

module SyncSubscriptionLocalizations
  def self.run!(key_id:, issuer_id:, key_path:, bundle_id:, source_dir:, dry_run: true)
    UI.user_error!("Missing bundle_id (set app_identifier in fastlane/Appfile)") if bundle_id.to_s.strip.empty?
    UI.user_error!("Missing source_dir: #{source_dir}") unless File.directory?(source_dir)

    entries = load_entries(source_dir)
    if entries.empty?
      UI.important("No subscription localization files found under #{source_dir}; skipping sync")
      return
    end

    token = Spaceship::ConnectAPI::Token.create(
      key_id: key_id,
      issuer_id: issuer_id,
      filepath: key_path,
      duration: 1200
    )
    client = Spaceship::ConnectAPI::APIClient.new(token: token)

    app_id = fetch_app_id(client, bundle_id)
    UI.message("ASC app: #{bundle_id} (id=#{app_id})")
    subscriptions_by_product_id = fetch_subscriptions_by_product_id(client, app_id)

    grouped = entries.group_by { |e| e[:product_id] }
    grouped.keys.sort.each do |product_id|
      UI.header("Subscription #{product_id}")
      sub = subscriptions_by_product_id[product_id] || fetch_subscription_by_product_id(client, product_id)
      if sub.nil?
        UI.important("Skipping product_id=#{product_id}: no matching subscription found in App Store Connect")
        next
      end

      subscription_id = sub.fetch("id")
      UI.message("ASC subscription id=#{subscription_id}")

      existing = fetch_subscription_localizations(client, subscription_id)
      by_locale = existing.to_h do |loc|
        attrs = loc.fetch("attributes", {})
        [attrs["locale"], loc]
      end

      grouped.fetch(product_id).sort_by { |e| e[:locale] }.each do |entry|
        locale = entry.fetch(:locale)
        desired = entry.fetch(:attributes)
        current = by_locale[locale]

        if current
          loc_id = current.fetch("id")
          loc_state = current.fetch("attributes", {})["state"]
          if loc_state.to_s.upcase == "REJECTED"
            UI.important("#{locale}: skipping subscriptionLocalization id=#{loc_id} (state=REJECTED)")
            next
          end
          UI.message("#{locale}: update subscriptionLocalization id=#{loc_id}")
          next if dry_run
          patch_subscription_localization(client, loc_id, desired)
        else
          UI.message("#{locale}: create subscriptionLocalization")
          next if dry_run
          create_subscription_localization(client, subscription_id, locale, desired)
        end
      end
    end

    UI.important("DRY_RUN enabled: no changes were sent to App Store Connect") if dry_run
  end

  def self.load_entries(source_dir)
    Dir.glob(File.join(source_dir, "*", "*.json")).sort.map do |path|
      product_id = File.basename(File.dirname(path))
      locale = File.basename(path, ".json")
      raw = JSON.parse(File.read(path))

      name = raw["name"]
      description = raw["description"]
      UI.user_error!("Missing name/description in #{path} (expected {\"name\":..., \"description\":...})") if name.to_s.strip.empty? || description.to_s.strip.empty?

      { product_id: product_id, locale: locale, attributes: { "name" => name, "description" => description } }
    end
  end

  def self.fetch_app_id(client, bundle_id)
    res = client.get("/v1/apps", { filter: { bundleId: bundle_id }, limit: 1 })
    data = res.body.fetch("data", [])
    UI.user_error!("App not found for bundle_id=#{bundle_id}") if data.empty?
    data.first.fetch("id")
  end

  def self.fetch_subscription_by_product_id(client, product_id)
    res = client.get("/v1/subscriptions", { filter: { productId: product_id }, limit: 1 })
    data = res.body.fetch("data", [])
    data.first
  rescue => e
    UI.error("Failed to query /v1/subscriptions (#{e.class}: #{e.message})")
    nil
  end

  def self.fetch_subscriptions_by_product_id(client, app_id)
    res = client.get(
      "/v1/apps/#{app_id}/subscriptionGroups",
      {
        include: "subscriptions",
        limit: 50,
        "limit[subscriptions]" => 50
      }
    )
    included = res.body.fetch("included", [])
    subscriptions = included.select { |item| item["type"] == "subscriptions" }
    subscriptions.each_with_object({}) do |sub, out|
      product_id = sub.dig("attributes", "productId")
      out[product_id] = sub if product_id.to_s.strip.length > 0
    end
  rescue => e
    UI.error("Failed to query subscription groups for app id=#{app_id} (#{e.class}: #{e.message})")
    {}
  end

  def self.fetch_subscription_localizations(client, subscription_id)
    res = client.get("/v1/subscriptions/#{subscription_id}/subscriptionLocalizations", { limit: 200 })
    res.body.fetch("data", [])
  end

  def self.patch_subscription_localization(client, localization_id, attributes)
    body = {
      data: {
        id: localization_id,
        type: "subscriptionLocalizations",
        attributes: attributes
      }
    }
    client.patch("/v1/subscriptionLocalizations/#{localization_id}", body)
  end

  def self.create_subscription_localization(client, subscription_id, locale, attributes)
    body = {
      data: {
        type: "subscriptionLocalizations",
        attributes: attributes.merge("locale" => locale),
        relationships: {
          subscription: {
            data: {
              type: "subscriptions",
              id: subscription_id
            }
          }
        }
      }
    }
    client.post("/v1/subscriptionLocalizations", body)
  end
end
