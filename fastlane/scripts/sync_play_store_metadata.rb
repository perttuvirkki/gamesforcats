require "fileutils"
require "fastlane_core/ui/ui"

module SyncPlayStoreMetadata
  UI = FastlaneCore::UI

  LOCALE_MAP = {
    "fi" => "fi-FI",
    "sv" => "sv-SE"
  }.freeze

  LEGAL_URL_PATTERNS = [
    /supersmart\.fi\/privacy/i,
    /apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula/i
  ].freeze

  def self.run!(source_dir:, target_dir:, dry_run: true)
    UI.user_error!("Missing source_dir: #{source_dir}") unless File.directory?(source_dir)
    FileUtils.mkdir_p(target_dir) unless dry_run

    locales = Dir.children(source_dir)
      .reject { |name| name.start_with?(".") }
      .map { |name| File.join(source_dir, name) }
      .select { |path| File.directory?(path) }
      .map { |path| File.basename(path) }
      .sort

    UI.user_error!("No locales found under #{source_dir}") if locales.empty?

    locales.each do |ios_locale|
      play_locale = LOCALE_MAP.fetch(ios_locale, ios_locale)

      name = read_required(File.join(source_dir, ios_locale, "name.txt"))
      subtitle = read_required(File.join(source_dir, ios_locale, "subtitle.txt"))
      description = read_required(File.join(source_dir, ios_locale, "description.txt"))

      strip_legal = ENV["STRIP_LEGAL_LINKS"].to_s.strip != "0"
      description = strip_legal ? strip_legal_links(description) : description

      UI.message("Play listing: #{ios_locale} -> #{play_locale}")
      write_file(File.join(target_dir, play_locale, "title.txt"), name, dry_run: dry_run)
      write_file(File.join(target_dir, play_locale, "short_description.txt"), subtitle, dry_run: dry_run)
      write_file(File.join(target_dir, play_locale, "full_description.txt"), description, dry_run: dry_run)
    end

    UI.important("DRY_RUN enabled: no files were written") if dry_run
  end

  def self.read_required(path)
    UI.user_error!("Missing required file: #{path}") unless File.file?(path)
    File.read(path).to_s.strip + "\n"
  end

  def self.strip_legal_links(text)
    lines = text.to_s.split("\n")
    filtered = lines.reject { |line| LEGAL_URL_PATTERNS.any? { |re| line.match?(re) } }
    filtered.join("\n").strip + "\n"
  end

  def self.write_file(path, content, dry_run:)
    return if dry_run

    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content)
  end
end
