# Disky

Disky is a Discord bot that connects your server with the Bluesky platform, making it easy to track activity and gather analytics. Whether you're looking to monitor Bluesky posts or gain insights into user behavior, Disky has you covered.

[![Support Me on Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-orange?style=flat-square&logo=ko-fi)](https://ko-fi.com/apfelteesaft)

---

## Current Features

### 1. Watch / Unwatch Bluesky Profiles for Posts
- Automatically announces every Bluesky post to a specified role in Discord.
- The announcement channel is the one where the command is executed.
- Refer to the implementation in [`src/commands/watcher.ts`](src/commands/watcher.ts) for details.

### 2. Get Analytics for a Bluesky User
- Quickly fetch analytics for a specified Bluesky user.
- Provides insights in a simple and efficient manner.

---

## Planned Features

- **Bluesky Account Integration for Discord Users**:  
  Allow Discord users to log in with their Bluesky accounts, bypassing rate limits and personalizing the experience.

- **Cross-Server Compatibility**:  
  Extend functionality across multiple servers to better support community use cases.

- **Secure Data Storage**:  
  Use [Appwrite](https://appwrite.io/) to store sensitive data such as Bluesky bearer tokens securely. Special thanks to [Ray](https://github.com/reiyua) for introducing this service!

---

## Support

If you find Disky helpful and want to support its development, consider [buying me a coffee on Ko-fi](https://ko-fi.com/apfelteesaft). Your support means a lot!

---

## Contributions

Feel free to contribute to Disky! Whether it's reporting bugs, suggesting features, or submitting pull requests, your involvement is always appreciated. Let’s make Disky better together!
