# todo
 1. remove all direct sets
 1. deleted objects aren't cleaned up
 2. add semantic version to file
 5. Remove unneccesary events, for example, calling try_auth
 3. Parameter checking system
 4. security
 1. Create api map (documentation)
 
# sandbox
   - server script can register callbacks to part of object tree
   - can scope to part of object tree
   - runs as 3rd user level, prgm
   - Interacts with main program through 2 ways:
        - input - subscribe to events, though function on(evt, callback), once(evt, callback)
        - output - send events through function emit(evt, payload)
   - program obtains required permissions through event request_run_elevated - program requests action to be run with users permissions
     - request gets propagated to user
   - Program does firstRun time setup through event script_init
   
# instantiatedScripts
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
     - script instances are persistant, their states are not
  - scoping:
    - if event object contains path, fix path
    - wildcard = all pathed events + nonpathed events 3 args
    - 2 types of events, pathed, unpathed
        - definition of pathed:
            - in array: path must start with 'path'
            - in evt: path must be defined (doesn't need to start with 'path')
        - unpathed is anything else
    - two functions:
       - scopeSrc - converts outside events to be recieved by script
          - convert from obj to obj
          - if event is pathed, cut off front part of path
       - scopeDst - converts events sent by script to outside format
          - converts from obj to array
          - if event is pathed, add prefix to path, including 'path'
       - emit(scopeDst(event),payload)
       - on(scopeDst(event), callback(scopeSrc(evt), payload))
       - if eventtype='*' then
           - call func for all pathed, then for '*'
           - this will cause problem if you do on([\*,\*,\*,\**])
              - for example, update root will trigger both the wildcard hook and the pathed hook
              - you only want to trigger the pathed hook