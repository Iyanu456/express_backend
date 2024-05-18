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
  uploadedImages: [String],
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