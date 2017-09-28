# todo
 1. Main object system
 1. remove all direct sets
 1. error checking
 1. Create api map (documentation)
 2. Server side scripts
 3. Parameter checking system
 
# sandbox
   - server script can register callbacks to part of object tree
   - can scope to part of object tree
   - runs as 3rd user level, prgm
   - Interacts with main program through 2 ways:
        - input - subscribe to events, though function on(evt, callback), once(evt, callback)
        - output - send events through function emit(evt, payload)
   - program obtains required permissions through event request_run_elevated - program requests action to be run with users permissions
     - request gets propagated to user
   - Program does first time setup through event script_init
   
# scripts
 - Scripts are stored using script code (persistent)
      - Script code is owned by user, but can be shared
 - Scripts are run as script instances (also persistent)
      - Script instances are owned by the server, but user has some control over them
      - Script instances simply store the id of the code the come from
      - Script instances are created through script_init code
         - script init will request all needed permissions, etc
      - Scripts should listen to script_stop event
   
# notes
  - need clearer definition of what is persistent and what is not
     - Subscriptions are NOT persistent