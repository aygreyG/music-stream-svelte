const isStable = process.env.STABLE_RELEASE === 'true';

module.exports = {
  branches: isStable ? ['main'] : [{ name: 'main', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml']
      }
    ],
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd: 'echo "version=${nextRelease.version}" >> $GITHUB_OUTPUT',
        successCmd: 'echo "sha=$(git rev-parse HEAD)" >> $GITHUB_OUTPUT'
      }
    ]
  ]
};
