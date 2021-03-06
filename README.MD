# docs rough copy

## list of modules/events

### gc

allows easy garbage collection of objects in the state

gc, pathed - set up path to be automatically deleted when certain event is fired
 - payload is array of events to trigger on
 
### obj

allows state modifications to be serialized as events

updateUserLevel - changes a users level
 - user - user to change level for
 - level - level to change level to
 
create, pathed - creates key in obj at path
 - newObjName - key to create
 - newObjVal - value to set key to
 
update, pathed - updates obj at path
 - value - value to set path to
 
delete, pathed - deletes obj at path

updatePerms, path - changes perms of object
 - user - user id to change perms for
 - perms - the perms object to change to

### persist

allows server state to persist even when server is stopped

saveServerState - saves the whole server state to file
 - emits saveStateFinished when done

### scripts

allows "scripts" to be run on the server, in a sandboxed environment

scriptStart - starts running a script instance
 - scriptInstanceID - the ID of the script to run
 
requestElevated, pathed - emitted by script to request permissions from user
 - path - the id of the request
 - payload - the event the script wants the user to emit
 
requestAccepted - tells server to accept requestElevated
 - firstReqID - the id of the first request to accept (to prevent concurrency errors)
 - responseLst - array of responses to requests
    - must be shorter or equal in length to response queue length
    - 3 possible vals: 
        - "accept" - run request
        - "reject" - don't run request
        - "skip" - tell script request was run, but don't actually run (may break stuff)
 
initDone - event script should emit when done setting up

initRun - event tells script that it should setup

scriptInitDone - event emitted when script is done initializing

instantiateScript - creates a script instance
 - payload should contain info needed to start the script:
     - sandboxOptions
     - vmOptions
     - scriptTimeout
     - runFromPath - run from code stored in state
        - scriptPath - path to get code from
     - code - only needed if runFromPath is false
     
scriptInstantiated - fired by server when script instance is ready to be run
 - payload should contain id of script just instantiated
     
### subscribe

allows other users subscribe to state change events, but only if they have the right perms

subscribe - causes subscribed crud events to be copied and sent to client
 - name - may be single event name, or array of events to sub to
     -  if undefined, will be set to all crud events
 - src - src of event to subscribe to
 - path - path to subscribe to
 - dst - dst of event to subscribe to
 
subscribeSync, pathed - tells server to send sync update to client
 - path - the path of the object to sync
 
unsubscribe - same format as subscribe
 - removes all subscriptions as determined by payload

### user

createUser - creates a new user
  - username
  - password
  
changePassword - changes password of sending user
  - password
  
deleteUser - deletes sending user

# stuff for me

## todo
 1. separate auth from connection
    - everything that is not persistent should be limited to the connection (subscribe)
 1. think about script access
 1. add updatePerms to tests
 1. refactor everything to use gc
 1. make gc serializable
 1. use once whenever possible (save number of listeners)
 1. make scripts named instead of uuid, rename scriptInstantiated
 1. allow root users to change password of user, delete user, etc
 1. extract core functionality to another package
 1. make option for server to send events back to client that client has send
     - allows pessimistic mode
 4. security
      - Parameter checking system
      - use typescript
 1. consider using promises
 1. Create legit documentation
 1. optimize ws usage/ number of events that are sent
 
## sandbox
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
   
## scripts
 - Scripts are stored using script code (persistent)
      - Script code is owned by user, but can be shared
 - Scripts are run as script instances (also persistent)
      - Script instances are owned by the server, but user has some control over them
      - Script instances simply store the id of the code the come from
      - Script instances are created through script_init code
         - script init will request all needed permissions, etc
      - Scripts should listen to script_stop event
   
## notes
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