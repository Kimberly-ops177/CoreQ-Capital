const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.send(settings);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    Object.assign(settings, req.body);
    settings.updatedAt = new Date();
    await settings.save();
    res.send(settings);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = { getSettings, updateSettings };