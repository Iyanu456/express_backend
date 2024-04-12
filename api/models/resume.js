const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumes: [
    {
      id: {
        type: String,
        unique: true, // Ensures each resume has a unique identifier
        required: true
      },
      name: {
        type: String,
        unique: true, // Ensures each resume has a unique name
        required: true
      },
      personalInfo: {
        fullname: String,
        jobTitle: String,
        email: String,
        website: String,
        phone: String
      },
      education: [
        {
          school: String,
          degree: String,
          duration: String,
          visible: { type: Boolean, default: true }
        }
      ],
      skills: [
        {
          skill: String,
          visible: { type: Boolean, default: true }
        }
      ],
      experience: [
        {
          jobTitle: String,
          company: String,
          description: String,
          duration: String,
          visible: { type: Boolean, default: true }
        }
      ],
      projects: [
        {
          project: String,
          about: String,
          description: String,
          duration: String,
          visible: { type: Boolean, default: false }
        }
      ],
      contactInfo: [
        {
          name: String,
          label: String,
          src: String,
          visible: { type: Boolean, default: true }
        }
      ]
    }
  ]
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;

