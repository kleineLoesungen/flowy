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
  - FIXME: NEXT
    - mail notification
  - templates
    - check tests
  - flow
    - in list of actions: badge with days until expected day. if <0 in red. same day in yellow, otherwise grey
    - e2e tests?

- After all
  - update tests/docs to working app
  - remove not used parts


## PROD
// Flow
- TODO: artefact -> content (template define values?)

// Flow 
- TODO: styling of Editor differs from Work/TemplateEditor

// General
- TODO: test cases for backend
- TODO: created user in admin panel have no password? label them (and offer no password option for existing users ?)
- TODO: Testing ENV.connetionString
- TODO: check relations with multi-ends
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