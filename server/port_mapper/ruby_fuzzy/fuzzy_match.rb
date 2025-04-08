#!/usr/bin/env ruby

require 'json'
require 'fuzzy_match'
require 'set'

# Read input from stdin
input = JSON.parse(STDIN.read)

# Extract search data and query
search_data = input['search_data']
query = input['query']
ports_data = input['ports_data']
stop_words = input['stop_words'] || []
searchable_fields = input['searchable_fields'] || []

confidence_threshold = 0.3
results = []

ports_data.each do |port|
  # Search in each searchable field
  searchable_fields.each do |field|
    if port[field]
      matcher = FuzzyMatch.new([port[field]], stop_words: stop_words)
      match = matcher.find_with_score(query)
      if match && match[1] > confidence_threshold
        results << {
          port_data: port,
          confidence_score: (match[1] * 100).round(2),
          match_type: field
        }
      end
    end
  end

  # Search in other_names if available
  if port['other_names'] && port['other_names'].is_a?(Array)
    port['other_names'].each do |other_name|
      matcher = FuzzyMatch.new([other_name], stop_words: stop_words)
      other_name_match = matcher.find_with_score(query)
      if other_name_match && other_name_match[1] > confidence_threshold
        results << {
          port_data: port,
          confidence_score: (other_name_match[1] * 100).round(2),
          match_type: 'other_names'
        }
      end
    end
  end
end

# Sort results by confidence score in descending order
results.sort_by! { |r| -r[:confidence_score] }

# Remove duplicates (same port_data) keeping only the highest confidence match
unique_results = []
seen_ports = Set.new
results.each do |result|
  port_id = result[:port_data]['id'] # Using code as unique identifier
  unless seen_ports.include?(port_id)
    seen_ports.add(port_id)
    unique_results << result
  end
end

# Output results as JSON
puts JSON.generate(unique_results)

