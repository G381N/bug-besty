import mongoose from 'mongoose';

const subdomainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subdomain name is required'],
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  status: {
    type: String,
    enum: ['scanning', 'completed', 'error'],
    default: 'scanning'
  }
}, {
  timestamps: true,
  collection: 'subdomains'
});

// Compound index for faster queries
subdomainSchema.index({ projectId: 1, status: 1 });

const Subdomain = mongoose.models.Subdomain || mongoose.model('Subdomain', subdomainSchema);
export default Subdomain; 