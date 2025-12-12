# flowy

## Restructure
- Done
  - users
    - admin: register new user
  - teams
  - templates
    - new
    - view
    - edit
    - delete
    - no logged in
    - filter
    - durcation calculation
    - create flow
    - update element in template
  - login
  - flow
    - create flow from template
    - create flow without template
    - update flow
    - delete flow
    - complete flow
- TODO:
  - changelog: flows, comments, templates, teams, users (CRUD with user + element ids + timestamp)
    - add to each element a slight log area
  - admin
    - logging of actions
  - templates
    - check tests
    - e2e tests?

- After all
  - update tests/docs to working app
  - remove not used parts


## PROD
// Flow
- TODO: artefact -> content (template define values?)

// Flow 
- TODO: styling of Editor differs from Work/TemplateEditor

------
## After PROD

- TODO: admin cron job definition for archive done flows (x weeks after completed - shift to flows:closed in a file, without comments)

// Flow Templates
- FIXME: template editor: auto layout

// General
- TODO: element type: 'key-value' on click -> overview of all key-values (copyable)
- FIXME: remove unused parts

// Flows
- TODO: flow - completed > archive - /flows/archive (comments deleted)