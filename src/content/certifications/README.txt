How to add a certification
==========================

Create one `.md` file per certification in this folder. Filename is just an identifier
(e.g. salesforce-platform-developer-2.md).

Template:

   ---
   title: "Salesforce Certified Platform Developer II"
   issuer: "Salesforce"            # one of: Salesforce, AWS, Other
   dateEarned: 2023-06-15          # optional but recommended
   credentialUrl: "https://www.salesforce.com/trailblazer/..."  # optional - direct verification
   badgeUrl: "https://..."         # optional - image URL for the badge
   ---

Field notes:
- `issuer` controls which group the cert appears under on /credentials
- `dateEarned` sorts within each group (newest first)
- `credentialUrl` makes the cert title clickable for verification
- Body content is unused — frontmatter is all that renders

For the 19× Salesforce certs: paste your list from https://www.salesforce.com/trailblazer/sgoel2
and I (or you) can bulk-create the files.
