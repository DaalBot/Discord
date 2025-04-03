# Privacy Policy
Github users: If you are viewing this file on github it may be slightly out of date please consider visiting [this page](https://daalbot.xyz/Legal/Privacy) for a up to date version.
## What we store
By default, DaalBot does not store any data with the exception of data that is needed for the bot to function. This data is stored in a database and is only accessible by the bot owner.

No other data relating to the server is stored except for events like the bot being added / removed from the server which will send a log to a private channel and contains the server name and ID. 

DaalBot does not store any data about the users in the server except for when needed like tracking certain aspects of a user in the server but this data is never sent to logs of any kind.

## How the data is stored
Most data is stored within a plain text database on the bots server; however, some data is stored in a encrypted manner. This data is only accessible by the bot owner and is not shared with any 3rd party services.

### Encrypted data
While data is encrypted it is **not stored in a way that is impossible to decrypt**. Decryption keys are never stored on the same server as the data or on disk at all if possible. This means that even if the server is compromised the data is still safe.

## 3rd party services
DaalBot sometimes reaches out to 3rd party services to store / retrieve data. You can see what services are used and find links to their sites where you can find a privacy policy.

* [ImgBB](https://imgbb.com/) - Used to store images
* [Twitch](https://www.twitch.tv/) - Used to provide twitch integration
* [Termbin](https://termbin.com) - Used to store raw data for logging (Deleted automatically after 1 week)

## Enforcement of the terms of service

### Site
We may use request data to enforce the terms of service. This may include but is not limited to, the server ID, user ID, IP address, and any other data that is needed to enforce the terms of service.<br/>

This data is stored in a (*plain text*) database on api.daalbot.xyz and data from it is only accessible by the bot owner.

#### What is stored
We may store the following data:
* User ID
* Access Token / ID pairs [Hashed]
* Previous dashboard related API requests (e.g. Modifying events) alongside your user ID

Disclaimer: Any page that contacts api.daalbot.xyz or bot.daalbot.xyz will log your IP address and details about your request an example of which is provided below. This is to prevent abuse of our services.

```log
[ip hidden] - - [05/Dec/2024:15:49:48 +0000] "GET /get/bot/stats HTTP/1.1" 200 129 "https://daalbot.xyz/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
```

## Questions and removal
If you have any questions about the privacy policy please or want your data removed please create a ticket in the [support server](https://lnk.daalbot.xyz/HQ) or contact the bot owner directly.

## Data Removal

### Automatic Removal
To have your server data removed automatically, you can run `/data actions delete` in your server (currently guild only). This will initiate a timer to delete all data about your server after a customizable amount of time.

This process will also start automatically if the bot is removed from your server, with a timer set to 1 week. This ensures that any unnecessary data is cleaned up and user data is protected. The process will stop if the bot is re-added to the server.

Once the data is removed, it will not be recoverable, and no support will be provided to recover the data.

In order to cancel the deletion process, you can run `/data actions cancel` in your server. Or, if the deletion process was initiated by the bot being removed, you can re-add the bot to your server. This will stop the deletion process.

### Manual Removal
If you wish to have your data removed, such as when you want to delete yourself from all servers, please contact the bot owner directly or create a ticket in the [support server](https://lnk.daalbot.xyz/HQ). While this process should quickly remove most of the data, it may take longer to remove all data completely.

## Data requests
If you would like to request a copy of the data that is stored about you or your server you can create a ticket in the [support server](https://lnk.daalbot.xyz/HQ) or use our automated system by running `/data actions downloads` in your server.

### Automated downloads
Automated downloads is currently only available to find data about servers. Inside of this data package you will find the following (if applicable):
* Event data (e.g. list of events and thier status, code, and variables) - "events/"
* Server configuration (e.g. level up message channel) - "config/"
* Autorole settings - "autorole/"
* Logging settings - "logging/"
* Managed data (other data that is managed by a helper function) - "managed/"
* Tickets (transcripts and other ticket related data) - "tickets/"
* Verification settings - "verify/"
* Welcomer settings - "welcome/"
* User XP and level rewards - "xp/"

### Backups
While data is wiped from the main database instantly it may be retained in backups until the backup is deleted. This is to ensure that data can be recovered in the event of a failure.

These backups are stored until the backup store reaches storage limit and are deleted in a FIFO manner. This means that the oldest backup will be deleted first. Backups are also deleted after 90 days.

# Analytics & Statistics
DaalBot may collect analytic data to either improve the services or to see how much traffic the bot is getting. This data is stored in a JSON database provided by [pantry](https://getpantry.cloud) that is governed by their privacy policy; however, this data doesnt contain identifiable information and may be used to provide anonymous statistics to the public. (e.g. Total servers, Messages processed, etc.)

## Changes
DaalBot reserves the right to change the privacy policy at any time with or without notice. It is your responsibility to check this page for any changes. If you do not agree with the changes you may remove the bot from your server at any time.