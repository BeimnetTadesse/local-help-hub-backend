const Announcement = require('../models/Announcement');

// Create announcement (admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: 'Title and content are required' });

    const newAnnouncement = new Announcement({
      title,
      content,
      createdBy: req.user.userId,
    });

    await newAnnouncement.save();

    res.status(201).json({ message: 'Announcement created', announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete announcement (admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    // Optionally verify admin ownership here

    await announcement.remove();

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
