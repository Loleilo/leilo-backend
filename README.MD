# todo
 - check what causes errors not to be shown
 1. make 'tmp' objects, which server doesn't save
 1. autocleanup
 1. add whitelist thing to sandbox
 1. evttables
 1. make state modifiers inside state not have to have state as param
 1. organize state tree <- probably will never do
 2. add semantic version to file
 4. security
      - Parameter checking system
 1. Create documentation
 1. optimize ws usage/ number of events that are sent
 1. make obj events universal (aka no converting except in engine) <-- cancer
 1. think about sandboxing server code
 
# sandbox
   - server script can register callbacks to part of object tree
   - can scope to part of object tree
   - runs as 3rd user level, prgm
   - Interacts with main program through 2 ways:
        - input - subscribe to events, though function on(evt, callback), once(evt, callback)
        - output - send events through function emit(evt, payload)
   - program obtains required permissions through event request_run_elevated - program
    requests action to be run with passwordHashes permissions
     - request gets propagated to user
   - Program does needInit time setup through event script_init
   
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
  - payload must be serializable (etc no callbacks allowed)
  - consider sending callbacks in events
  - use engine.on as often as possible, since its way more efficeint
  - make sure state object is never leaked through sandbox
  - script probably should not know parent user id
  - do we really need a custom middleware system?
     - the only thing its used for is to make sure scripts are in order, which is not even that important
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