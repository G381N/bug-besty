import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['initializing', 'active', 'archived'],
    default: 'active'
  },
  enumerationTaskId: {
    type: String
  },
  subdomainsCount: {
    type: Number,
    default: 0
  },
  vulnerabilitiesFound: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the index to include userId for proper uniqueness per user
projectSchema.index({ name: 1, status: 1, userId: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project; 