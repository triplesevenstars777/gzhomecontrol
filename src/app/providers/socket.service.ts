import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import socketIo from "socket.io-client";
import { OfflineProvider } from "./offline/offline";
import { UnknowFailureProvider } from "./unknow-failure/unknow-failure";
import { UserStorage } from "./user/user-storage";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socketPath: any = undefined;
  private socket: any = null;

  isSocketSubject = new BehaviorSubject<boolean>(this.hasSocket());

  constructor(
    public unknowFailure: UnknowFailureProvider,
    public offline: OfflineProvider,
    public userStorage: UserStorage
  ) {}

  setUrl(url: string) {
    this.socketPath = url;
  }

  getUrl() {
    return this.socketPath;
  }

  public initSocket(basePath?: string): void {
    let token = this.userStorage.TOKEN_KEY || "";
    if (basePath) {
      this.socketPath = basePath;
    } else {
      basePath = this.userStorage.API_URL || "";
      if (!basePath) {
        return;
      }
      this.socketPath = basePath;
    }
    if (!this.socket) {
      this.connect(token);
    } else {
      const sock_token = this.socket.query ? this.socket.query.token : "";
      if (sock_token != token) {
        this.reConnect(token);
      }
      console.warn(
        "SOCKET IS RUNNING IN:::>",
        this.socketPath,
        "WITH TOKEN::> ",
        sock_token,
        " == ",
        token
      );
    }
  }

  connect(token) {
    if (this.socketPath == undefined || token == null) {
      console.warn("Can`t init socket with token null");
      return;
    }

    this.socket = socketIo(this.socketPath, {
      query: { token },
      transports: ["websocket"]
    });

    //console.log("SOCKET INIT IN:::>", this.socketPath, "WITH TOKEN::> ", token);

    this.onEvent("disconnect").subscribe((res: any) => {
      // console.error("SOCKET EVENT::: ", res);

      //this.unknowFailure.setOnFailure();

      this.isSocketSubject.next(false);
    });

    this.onEvent("connect").subscribe((res: any) => {
      //console.log("SOCKET EVENT::: ", res);

      this.unknowFailure.setOffFailure();
      this.offline.setOnline();

      this.isSocketSubject.next(true);
    });
  }

  public reConnect(token) {
    // console.log("socketService reConnect");
    if (!this.socket) {
      this.connect(token);

      return;
    }
    const sock_token = this.socket.query ? this.socket.query.token : "";
    if (sock_token != token) {
      this.disconnect();
      this.connect(token);
    }
  }

  /**
   *
   * @returns {Observable<T>}
   */
  isSocketConnected(): Observable<boolean> {
    return this.isSocketSubject.asObservable();
  }

  /**
   * if we have token we are connected to socketIO
   * @returns {boolean}
   */
  public hasSocket(): boolean {
    if (!this.socket) {
      return false;
    }

    return true;
  }

  public send(message: any): void {
    this.socket.emit("message", message);
  }

  public onMeasureCreated(): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socket) {
        this.initSocket();
      }
      if (this.socket) {
        this.socket.on("measure:created", (data: any) => observer.next(data));
      } else {
        console.error('Socket is not initialized');
        observer.error('Socket is not initialized');
      }
    });
  }



  public onDeviceCreated(): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socket) {
        this.initSocket();
      }
      if (this.socket) {
        this.socket.on("device:created", (data: any) => observer.next(data));
      } else {
        console.error('Socket is not initialized');
        observer.error('Socket is not initialized');
      }
    });
  }



  public onActuationUpdated(): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socket) {
        this.initSocket();
      }
      if (this.socket) {
        this.socket.on("actuation:updated", (data: any) => observer.next(data));
      } else {
        console.error('Socket is not initialized');
        observer.error('Socket is not initialized');
      }
    });
  }



  public onEvent(event: any): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socket) {
        this.initSocket();
      }
      if (this.socket) {
        this.socket.on(event, () => observer.next(event));
      } else {
        console.error('Socket is not initialized');
        observer.error('Socket is not initialized');
      }
    });
  }



  public disconnect() {
    if (this.socket) {
      console.log("socketService disconnect");
      this.socket.disconnect();
    }
    this.socket = null;
  }
}
