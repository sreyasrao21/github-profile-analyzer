const axios = require('axios');

const githubApi = axios.create({
  baseURL: process.env.GITHUB_API_URL || 'https://api.github.com',
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
  },
});

async function fetchProfile(username) {
  const { data } = await githubApi.get(`/users/${username}`);
  return data;
}

module.exports = { fetchProfile };
