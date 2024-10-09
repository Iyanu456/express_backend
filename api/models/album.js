const mongoose = require('mongoose');



const AlbumSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  yearsAlive: {
    type: String,
    required: true,
  },
  fullNameOfPerson: {
    type: String,
    required: true,
  },
  uploadedImages: [String],
  uploadedVideo: {
    type: String,  // This field will store the URL of the uploaded video
    required: false,
  },
  thumbnail: {  // New field for the thumbnail URL
    type: String,
    required: false,  // Make this optional; it can be set later
  },
  pages: [
    {
      page: Number,
      mainPreviewImages: [String],
      editedImages: [String],
      positionsData: [{ x: Number, y: Number }],
      zoomData: [Number],
      template: String,
      visible: Boolean,
    },
  ],
});

module.exports = mongoose.model('Album', AlbumSchema);
