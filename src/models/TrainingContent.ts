import mongoose from 'mongoose';

const trainingContentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['High', 'Medium', 'Low']
  },
  category: {
    type: String,
    required: true
  },
  impact: [{
    type: String,
    required: true
  }],
  prevention: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

export default mongoose.models.TrainingContent || mongoose.model('TrainingContent', trainingContentSchema); 