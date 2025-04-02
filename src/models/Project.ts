import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  mainDomain: {
    type: String,
    required: [true, 'Main domain is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true,
  collection: 'projects'
});

// Update the index to include userId for proper uniqueness per user
projectSchema.index({ name: 1, status: 1, userId: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project; 