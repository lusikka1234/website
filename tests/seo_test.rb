require 'jekyll'
require 'tmpdir'

# Run with: bundle exec ruby tests/seo_test.rb
class SeoTest
  def assert(condition, message = 'Assertion failed')
    raise message unless condition
  end

  def assert_equal(expected, actual)
    assert expected == actual, "Expected #{expected.inspect}, got #{actual.inspect}"
  end

  def assert_includes(output, expected)
    assert output.include?(expected), "Missing #{expected.inspect}"
  end

  ROOT = File.expand_path('..', __dir__)

  def render
    Dir.mktmpdir('lusikka-seo') do |destination|
      site = Jekyll::Site.new(Jekyll.configuration('source' => ROOT, 'destination' => destination, 'quiet' => true))
      site.reset
      site.read
      yield site if block_given?
      site.generate
      site.render
      return site
    end
  end

  def home(site)
    site.pages.find { |page| page.name == 'index.md' }
  end

  def test_defaults_and_localized_metadata
    output = home(render).output
    english, finnish = output.split('<template id="seo-fi">', 2)
    assert_includes english, '<title data-seo>Lusikka.art</title>'
    assert_includes english, 'name="description" content="Selected works by Suvi Vainikka.'
    assert_includes english, 'rel="canonical" href="https://lusikka.art/"'
    assert_includes english, 'property="og:image" content="https://lusikka.art/img1.PNG"'
    assert_includes finnish, 'name="description" content="Suvi Vainikan valikoituja teoksia.'
    assert_includes finnish, 'property="og:locale" content="fi_FI"'
  end

  def test_page_overrides_are_escaped_and_shared_with_social_tags
    output = home(render do |site|
      home(site).data['en']['seo'] = {
        'title' => 'Art & "Colour"', 'description' => 'An "art" collection & more',
        'image' => 'https://images.example/art.jpg', 'image_alt' => 'Red & blue'
      }
    end).output.split('<template', 2).first
    assert_includes output, '<title data-seo>Art &amp; &quot;Colour&quot;</title>'
    assert_includes output, 'property="og:title" content="Art &amp; &quot;Colour&quot;"'
    assert_includes output, 'name="description" content="An &quot;art&quot; collection &amp; more"'
    assert_includes output, 'name="twitter:image" content="https://images.example/art.jpg"'
    assert_includes output, 'property="og:image:alt" content="Red &amp; blue"'
  end

  def test_subpath_trailing_slash_and_collection_cover_fallback
    site = render do |site|
      site.data['seo']['site_url'] = 'https://example.com/'
      site.config['baseurl'] = '/portfolio'
    end
    output = site.collections['galleries'].docs.find { |page| page.basename_without_ext == 'paintings' }.output
    assert_includes output, '<title data-seo>Paintings — Lusikka.art</title>'
    assert_includes output, 'rel="canonical" href="https://example.com/portfolio/gallery/paintings/"'
    assert_includes output, 'property="og:image" content="https://example.com/portfolio/img1.PNG"'
  end

  def test_cms_exposes_defaults_and_overrides_on_every_public_page
    config = YAML.load_file(File.join(ROOT, 'admin/config.yml'), aliases: true)
    pages = config['collections'].find { |c| c['name'] == 'pages' }['files']
    galleries = config['collections'].find { |c| c['name'] == 'galleries' }
    (pages + [galleries]).each do |entry|
      seo = entry['fields'].find { |field| field['name'] == 'seo' }
      assert seo, "Missing SEO fields for #{entry['name']}"
      assert_equal true, seo['i18n']
      assert_equal %w[title description image image_alt], seo['fields'].map { |field| field['name'] }
    end
    settings = config['collections'].find { |c| c['name'] == 'settings' }['files'].first
    assert_equal '_data/seo.yml', settings['file']
  end
end

checks = SeoTest.new
checks.public_methods.grep(/^test_/).sort.each do |name|
  checks.public_send(name)
  puts "PASS #{name}"
end
