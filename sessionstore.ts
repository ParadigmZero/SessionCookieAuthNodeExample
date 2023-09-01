import { Mutex } from 'async-mutex';
import { clear } from 'console';
import { v4 as uuidv4 } from 'uuid';

const mutex = new Mutex();

interface Session {
  sessionId : M,
  username: string
  expires : number
}

enum SessionCommand {
  GET,
  CHECK,
  CLEAR,
  CLEARALL
}

const now = Number.MAX_SAFE_INTEGER;

let sessionsStack : Session[] = [];

type Mapish = { [k: string]: Session };
type M = keyof Mapish;

let sessionsMap : Mapish = {};



function clearExpired() {
  for(let i : (Session|undefined) = sessionsStack.shift();; sessionsStack.shift())
  {
    // If stack empty, stop clearing stack
    if(i === undefined)
    {
      break;
    }
    if(i.expires > now )
    {
      sessionsStack.unshift(i);
      break;
    }
    // remove from map too
    delete sessionsMap[i.sessionId];
  }
}

function clearAll() {
  sessionsStack = [];
  sessionsMap = {};
}



// Used with login
function get(user : string) : string {
  //create session
  const sessionIdRef: M = uuidv4();
  const sessionRef : Session = {
    sessionId : sessionIdRef,
    username : user,
    expires : Date.now()
  }

  clearExpired();
  sessionsStack.push(sessionRef);
  sessionsMap[sessionIdRef] = sessionRef;

  return sessionIdRef as string;
}

// Check session
function check(sessionId : string) : boolean {
  // clear stack, and all expired sessions should disappear
  clearExpired();

  // check session is there
  const session : (Session|undefined) = sessionsMap[sessionId];

  if(session !== undefined)
  {
      return true;
  }
  return false;
}


export function sessionManager(command : SessionCommand, payload? : string) : any {
  mutex
    .runExclusive(function() {
      switch(command) {
        case SessionCommand.CHECK:
          return check(payload as string);
        case SessionCommand.GET:
          return get(payload as string);
        case SessionCommand.CLEAR:
          clearExpired();
          break;
        case SessionCommand.CLEARALL:
          clearAll();
      }
    });
}

export function checkSession(session: string) : boolean {
  return sessionManager(SessionCommand.CHECK, session) ;
}

export function getSession(username : string) : string {
  return sessionManager(SessionCommand.GET,username) ;
}

export function clearExpiredSessions() : void {
  sessionManager(SessionCommand.CLEAR) ;
}

export function clearAllSessions() : void {
  sessionManager(SessionCommand.CLEARALL) ;
}

export default sessionManager;
