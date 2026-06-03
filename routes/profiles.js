const { Router } = require('express');
const { fetchProfile } = require('../services/github');
const { upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile, getStats } = require('../models/profile');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, sortBy, order, limit, offset } = req.query;
    const profiles = await getAllProfiles({ search, sortBy, order, limit, offset });
    res.json({ count: profiles.length, profiles });
  } catch (err) {
    next(err);
  }
});

router.get('/export/csv', async (req, res, next) => {
  try {
    const profiles = await getAllProfiles({ sortBy: 'updated_at', order: 'desc' });
    const header = 'username,name,avatar_url,bio,company,location,email,twitter,public_repos,public_gists,followers,following,github_created_at,profile_url';
    const rows = profiles.map(p =>
      [p.username, p.name, p.avatar_url, p.bio, p.company, p.location, p.email, p.twitter_username,
       p.public_repos, p.public_gists, p.followers, p.following, p.github_created_at, p.profile_url]
        .map(v => v != null ? `"${String(v).replace(/"/g, '""')}"` : '""').join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=profiles.csv');
    res.send([header, ...rows].join('\n'));
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/:username', async (req, res, next) => {
  try {
    const profile = await getProfileByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.post('/:username', async (req, res, next) => {
  try {
    const data = await fetchProfile(req.params.username);
    const profile = {
      username: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      company: data.company,
      blog: data.blog,
      location: data.location,
      email: data.email,
      twitter_username: data.twitter_username,
      public_repos: data.public_repos,
      public_gists: data.public_gists,
      followers: data.followers,
      following: data.following,
      github_created_at: data.created_at,
      profile_url: data.html_url,
    };
    await upsertProfile(profile);
    const saved = await getProfileByUsername(data.login);
    res.status(201).json(saved);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    if (err.response?.status === 403) {
      return res.status(429).json({ error: 'GitHub API rate limit exceeded' });
    }
    next(err);
  }
});

router.delete('/:username', async (req, res, next) => {
  try {
    const deleted = await deleteProfile(req.params.username);
    if (!deleted) return res.status(404).json({ error: 'Profile not found' });
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
