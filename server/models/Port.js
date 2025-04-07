const mongoose = require('mongoose');

const latLonSchema = new mongoose.Schema({
  lat: Number,
  lon: Number
});

const portSchema = new mongoose.Schema({
  id: String,
  code: String,
  name: String,
  display_name: String,
  other_names: [String],
  city: String,
  state_name: String,
  country: String,
  country_code: String,
  region: String,
  port_type: String,
  lat_lon: latLonSchema,
  nearby_ports: mongoose.Schema.Types.Mixed,
  other_details: mongoose.Schema.Types.Mixed,
  deleted: { type: Boolean, default: false },
  client_group_id: String,
  created_at: Date,
  updated_at: Date,
  sort_order: { type: Number, default: 0 },
  verified: Boolean,
  sailing_schedule_available: Boolean,
  item_type: String,
  master_port: Boolean,
  address: String,
  fax_number: String,
  telephone_number: String,
  website: String,
  description: String,
  seo_code: String,
  seo_updated: Boolean,
  is_head_port: Boolean,
  prefer_inland: Boolean,
  country_port: Boolean
}, {
  timestamps: true,
  collection: 'ports'
});

// Create indexes for frequently searched fields
portSchema.index({ name: 1 });
portSchema.index({ code: 1 });
portSchema.index({ display_name: 1 });
portSchema.index({ country: 1 });
portSchema.index({ region: 1 });
portSchema.index({ city: 1 });
portSchema.index({ state_name: 1 });

const Port = mongoose.model('Port', portSchema);

module.exports = Port; 