import { Mutex } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';

const mutex = new Mutex();
const sessionSecondsTimeout = 30 * 60; // 30 minutes

interface Session {
  id : string,
  username: string
  expires : number
}

enum SessionCommand {
  GET,
  CHECK,
  CLEAR_SINGLE,
  CLEAR_EXPIRED,
  CLEAR_ALL
}

/* 
  Sessions are referenced in two data structures. A stack and a map
  A stack to aid in eliminating older expired sessions
  A map (actually just a JavaScript object) for quick lookup of sessions
*/
let sessionsStack : Session[] = [];
let sessionsMap : { [k: string]: Session } = {};

function clearExpired() {
  for(let session : (Session|undefined) = sessionsStack.shift();; session = sessionsStack.shift())
  {
    // If stack empty, stop clearing stack
    if(session === undefined)
    {
      break;
    }
    // if oldest session (i.e. end of stack) not expired, then stop clearing stack
    if(session.expires > Date.now())
    {
      sessionsStack.unshift(session);
      break;
    }
    // remove reference from map too since that is where we lookup
    delete sessionsMap[session.id];
  }
}

function clearAll() {
  sessionsStack = [];
  sessionsMap = {};
}



// Used with login
async function get(user : string) : Promise<string> {
  const sessionRef : Session = {
    id : `session=${uuidv4()}`,
    username : user,
    expires : Date.now() + (sessionSecondsTimeout * 1000)
  }

  sessionsStack.push(sessionRef);
  sessionsMap[sessionRef.id] = sessionRef;

  return `${sessionRef.id}; Path = /; Expires=${new Date(sessionRef.expires).toUTCString()}`;
}

// Check session
async function check(id : string) : Promise<boolean> {
  // check session is there
  const session : (Session|undefined) = sessionsMap[id];

  if(session !== undefined)
  {
      return true;
  }
  return false;
}


async function sessionManager(command : SessionCommand, payload? : string) : Promise<any> {
  return await mutex.runExclusive( async function() {
      switch(command) {
        case SessionCommand.CHECK:
          return check(payload as string);
        case SessionCommand.GET:
          return get(payload as string);
        case SessionCommand.CLEAR_SINGLE:
          delete sessionsMap[payload as string];
          break;
        case SessionCommand.CLEAR_EXPIRED:
          clearExpired();
          break;
        case SessionCommand.CLEAR_ALL:
          clearAll();
      }
    });
}

export async function checkSession(session: string) : Promise<boolean> {
  return await sessionManager(SessionCommand.CHECK, session) ;
}

export async function getSession(username : string) : Promise<string> {
  return await sessionManager(SessionCommand.GET,username) ;
}

export function clearSession(id : string) : void {
  sessionManager(SessionCommand.CLEAR_SINGLE, id);
}

export function clearExpiredSessions() : void {
  sessionManager(SessionCommand.CLEAR_EXPIRED) ;
}

export function clearAllSessions() : void {
  sessionManager(SessionCommand.CLEAR_ALL) ;
}

export default sessionManager;
