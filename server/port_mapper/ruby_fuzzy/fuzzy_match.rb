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

# Search each field separately

confidence_threshold = 0.4
results = []
ports_data.each_with_index do |port, index|
  # Search in name field
  if port['name']
    matcher = FuzzyMatch.new([port['name']], stop_words: stop_words)
    name_match = matcher.find_with_score(query)
    if name_match && name_match[1] > confidence_threshold # threshold for name matches
      results << {
        matched_data: port['name'],
        confidence_score: (name_match[1] * 100).round(2),
        levenshtein_score: name_match[2],
        port_data: port,
        matched_field: 'name'
      }
    end
  end

  # Search in code field
  if port['code']
    matcher = FuzzyMatch.new([port['code']], stop_words: stop_words)
    code_match = matcher.find_with_score(query)
    if code_match && code_match[1] > confidence_threshold # threshold for code matches
      results << {
        matched_data: port['code'],
        confidence_score: (code_match[1] * 100).round(2),
        levenshtein_score: code_match[2],
        port_data: port,
        matched_field: 'code'
      }
    end
  end

  # Search in display_name field
  if port['display_name']
    matcher = FuzzyMatch.new([port['display_name']], stop_words: stop_words)
    display_name_match = matcher.find_with_score(query)
    if display_name_match && display_name_match[1] > confidence_threshold # threshold for display_name matches
      results << {
        matched_data: port['display_name'],
        confidence_score: (display_name_match[1] * 100).round(2),
        levenshtein_score: display_name_match[2],
        port_data: port,
        matched_field: 'display_name'
      }
    end
  end

  # Search in other_names if available
  if port['other_names'] && port['other_names'].is_a?(Array)
    port['other_names'].each do |other_name|
      matcher = FuzzyMatch.new([other_name], stop_words: stop_words)
      other_name_match = matcher.find_with_score(query)
      if other_name_match && other_name_match[1] > confidence_threshold # threshold for other_names matches
        results << {
          matched_data: other_name,
          confidence_score: (other_name_match[1] * 100).round(2),
          levenshtein_score: other_name_match[2],
          port_data: port,
          matched_field: 'other_names'
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
  port_id = result[:port_data]['code'] # Using code as unique identifier
  unless seen_ports.include?(port_id)
    seen_ports.add(port_id)
    unique_results << result
  end
end

# Output results as JSON
puts JSON.generate(unique_results)

