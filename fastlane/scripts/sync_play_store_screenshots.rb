require "fileutils"
require "fastlane_core/ui/ui"

module SyncPlayStoreScreenshots
  UI = FastlaneCore::UI

  CATEGORY_MAP = [
    [/phone/i, "phoneScreenshots"],
    [/(^|[^0-9])7([^0-9]|$)/, "sevenInchScreenshots"],
    [/(^|[^0-9])10([^0-9]|$)/, "tenInchScreenshots"],
    [/tablet/i, "tenInchScreenshots"],
    [/tv/i, "tvScreenshots"],
    [/wear|watch/i, "wearScreenshots"],
  ].freeze

  def self.run!(source_dir:, target_dir:, dry_run: true, duplicate_uk_from_us: true, duplicate_seven_from_ten: true)
    UI.user_error!("Missing source_dir: #{source_dir}") unless File.directory?(source_dir)
    FileUtils.mkdir_p(target_dir) unless dry_run

    locale_dirs = Dir.children(source_dir)
      .reject { |name| name.start_with?(".") }
      .map { |name| File.join(source_dir, name) }
      .select { |path| File.directory?(path) }
      .sort

    if locale_dirs.empty?
      UI.important("No screenshot locales found under #{source_dir}")
      return
    end

    locale_dirs.each do |locale_path|
      locale_dir_name = File.basename(locale_path)
      locale_code = locale_dir_name[/\(([^)]+)\)\s*\z/, 1] || locale_dir_name.strip
      next if locale_code.to_s.strip.empty?

      device_dirs = Dir.children(locale_path)
        .reject { |name| name.start_with?(".") }
        .map { |name| File.join(locale_path, name) }
        .select { |path| File.directory?(path) }
        .sort

      next if device_dirs.empty?

      device_dirs.each do |device_path|
        device_dir_name = File.basename(device_path).to_s
        category = resolve_category(device_dir_name)
        unless category
          UI.important("Skipping unknown screenshot folder: #{locale_dir_name}/#{device_dir_name}")
          next
        end

        images = Dir.glob(File.join(device_path, "*.{png,jpg,jpeg}"), File::FNM_CASEFOLD)
          .select { |p| File.file?(p) }
          .sort

        next if images.empty?

        dest_dir = File.join(target_dir, locale_code, "images", category)
        UI.message("Play screenshots: #{locale_code} #{category} (#{images.length})")

        next if dry_run

        FileUtils.mkdir_p(dest_dir)
        Dir.glob(File.join(dest_dir, "*.{png,jpg,jpeg}"), File::FNM_CASEFOLD).each { |p| FileUtils.rm_f(p) }

        images.each do |img|
          FileUtils.cp(img, File.join(dest_dir, File.basename(img)))
        end
      end
    end

    if duplicate_seven_from_ten
      Dir.children(target_dir).reject { |n| n.start_with?(".") }.each do |locale_code|
        ten_dir = File.join(target_dir, locale_code, "images", "tenInchScreenshots")
        seven_dir = File.join(target_dir, locale_code, "images", "sevenInchScreenshots")
        next unless File.directory?(ten_dir)
        next if File.directory?(seven_dir)

        ten_images = Dir.glob(File.join(ten_dir, "*.{png,jpg,jpeg}"), File::FNM_CASEFOLD).select { |p| File.file?(p) }.sort
        next if ten_images.empty?

        UI.message("Play screenshots: duplicating #{locale_code} tenInchScreenshots -> sevenInchScreenshots")
        next if dry_run

        FileUtils.mkdir_p(seven_dir)
        ten_images.each do |img|
          FileUtils.cp(img, File.join(seven_dir, File.basename(img)))
        end
      end
    end

    if duplicate_uk_from_us
      us_dir = File.join(target_dir, "en-US")
      uk_dir = File.join(target_dir, "en-GB")
      if File.directory?(File.join(us_dir, "images")) && !File.directory?(File.join(uk_dir, "images"))
        UI.message("Play screenshots: duplicating en-US -> en-GB")
        unless dry_run
          FileUtils.mkdir_p(uk_dir)
          FileUtils.cp_r(File.join(us_dir, "images"), File.join(uk_dir, "images"))
        end
      end
    end

    UI.important("DRY_RUN enabled: no files were written") if dry_run
  end

  def self.resolve_category(name)
    normalized = name.to_s.strip.gsub(/\s+/, " ")
    CATEGORY_MAP.each do |pattern, category|
      return category if normalized.match?(pattern)
    end
    nil
  end
end
