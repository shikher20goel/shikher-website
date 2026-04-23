How to add a project
=====================

Create one `.md` file per project in this folder. Filename is just an identifier.

Template:

   ---
   title: "Project name"
   description: "One to three sentences on what it did, the impact, and the stack."
   url: "https://..."              # optional - live demo, repo, or case study
   role: "Lead Architect"          # optional - your role
   dateRange: "2022 – Present"     # optional - free-form
   tags: ["Salesforce", "AI", "Enterprise Architecture"]
   featured: true                  # optional - show on home page / boosted placement
   ---

Field notes:
- `tags` render as chips under the description
- `featured: true` entries appear first on /projects and are eligible for home-page highlight
- Body content unused — frontmatter is all that renders
