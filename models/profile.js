const pool = require('../config/db');

async function upsertProfile(profile) {
  const sql = `
    INSERT INTO profiles 
      (username, name, avatar_url, bio, company, blog, location, email, 
       twitter_username, public_repos, public_gists, followers, following, 
       github_created_at, profile_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), avatar_url = VALUES(avatar_url), bio = VALUES(bio),
      company = VALUES(company), blog = VALUES(blog), location = VALUES(location),
      email = VALUES(email), twitter_username = VALUES(twitter_username),
      public_repos = VALUES(public_repos), public_gists = VALUES(public_gists),
      followers = VALUES(followers), following = VALUES(following),
      github_created_at = VALUES(github_created_at), profile_url = VALUES(profile_url)
  `;
  const values = [
    profile.username, profile.name, profile.avatar_url, profile.bio,
    profile.company, profile.blog, profile.location, profile.email,
    profile.twitter_username, profile.public_repos, profile.public_gists,
    profile.followers, profile.following, profile.github_created_at,
    profile.profile_url,
  ];
  const [result] = await pool.execute(sql, values);
  return result;
}

async function getAllProfiles({ search, sortBy, order, limit, offset } = {}) {
  let sql = 'SELECT * FROM profiles';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push('(username LIKE ? OR name LIKE ? OR location LIKE ? OR company LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

  const allowedSort = ['username', 'name', 'followers', 'public_repos', 'public_gists', 'following', 'created_at', 'updated_at'];
  if (sortBy && allowedSort.includes(sortBy)) {
    sql += ` ORDER BY ${sortBy} ${order === 'asc' ? 'ASC' : 'DESC'}`;
  } else {
    sql += ' ORDER BY updated_at DESC';
  }

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }
  if (offset) {
    sql += ' OFFSET ?';
    params.push(parseInt(offset, 10));
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getProfileByUsername(username) {
  const [rows] = await pool.execute('SELECT * FROM profiles WHERE username = ?', [username]);
  return rows[0] || null;
}

async function deleteProfile(username) {
  const [result] = await pool.execute('DELETE FROM profiles WHERE username = ?', [username]);
  return result.affectedRows > 0;
}

async function getStats() {
  const [rows] = await pool.execute('SELECT COUNT(*) as total, AVG(followers) as avg_followers, AVG(public_repos) as avg_repos, MAX(followers) as max_followers, MAX(public_repos) as max_repos, SUM(followers) as total_followers FROM profiles');
  const [topFollowed] = await pool.execute('SELECT username, followers FROM profiles ORDER BY followers DESC LIMIT 1');
  const [topRepos] = await pool.execute('SELECT username, public_repos FROM profiles ORDER BY public_repos DESC LIMIT 1');
  return {
    ...rows[0],
    avg_followers: Math.round(rows[0].avg_followers || 0),
    avg_repos: Math.round(rows[0].avg_repos || 0),
    most_followed: topFollowed[0] || null,
    most_repos: topRepos[0] || null,
  };
}

module.exports = { upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile, getStats };
