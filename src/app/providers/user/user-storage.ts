import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { Constants } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class UserStorage {

    private APP_KEY = Constants.APP_KEY;
    private _API_URL: string = 'API_URL';
    private _IOT_HUB: string = 'IOT_HUB';
    private _EXPIRED_AT: string = this.APP_KEY + ':expires_at';
    private _USER_REMEMBER: string = this.APP_KEY + ':remember';
    private _TOKEN_KEY: string = this.APP_KEY + ':token';
    private _USER_TOKEN: string = this.APP_KEY + ':user';

    constructor(
        private cookieService: CookieService,
        private platform: Platform,
    ) {
    }

    set API_URL( API_URL ){
        if(API_URL == undefined) API_URL = "";
        if(this.isMobile()){
            localStorage.setItem(this._API_URL, API_URL);
        }else{
            this.cookieService.set(this._API_URL.replace(':', '_'), API_URL);
        }
    }

    get API_URL(){
        if(this.isMobile()){
            return localStorage.getItem(this._API_URL);
        }else{
            return this.cookieService.get(this._API_URL.replace(':', '_'));
        }
    }

    set IOT_HUB( IOT_HUB ){
        if(IOT_HUB == undefined) IOT_HUB = "";
        if(this.isMobile()){
            localStorage.setItem(this._IOT_HUB, IOT_HUB);
        }else{
            this.cookieService.set(this._IOT_HUB.replace(':', '_'), IOT_HUB);
        }
    }

    get IOT_HUB(){
        if(this.isMobile()){
            return localStorage.getItem(this._IOT_HUB);
        }else{
            return this.cookieService.get(this._IOT_HUB.replace(':', '_'));
        }
    }

    set REMEMBER ( REMEMBER ){
        if(REMEMBER == undefined) REMEMBER = "";
        if(this.isMobile()){
            localStorage.setItem(this._USER_REMEMBER, REMEMBER);
        }else{
            this.cookieService.set(this._USER_REMEMBER.replace(':', '_'), REMEMBER);
        }
    }

    get REMEMBER (){
        if(this.isMobile()){
            return localStorage.getItem(this._USER_REMEMBER);
        }else{
            return this.cookieService.get(this._USER_REMEMBER.replace(':', '_'));
        }
    }


    set TOKEN_KEY ( TOKEN_KEY ){
        if(TOKEN_KEY == undefined) TOKEN_KEY = "";
        if(this.isMobile()){
            localStorage.setItem(this._TOKEN_KEY, TOKEN_KEY);
        }else{
            this.cookieService.set(this._TOKEN_KEY.replace(':', '_'), TOKEN_KEY);
        }
    }

    get TOKEN_KEY (){
        if(this.isMobile()){
            return localStorage.getItem(this._TOKEN_KEY) || "";
        }else{
            return this.cookieService.get(this._TOKEN_KEY.replace(':', '_')) || null;
        }
    }

    set EXPIRED_AT ( EXPIRED_AT ){
        if(EXPIRED_AT == undefined) EXPIRED_AT = "";
        if(this.isMobile()){
            localStorage.setItem(this._EXPIRED_AT, EXPIRED_AT);
        }else{
            this.cookieService.set(this._EXPIRED_AT.replace(':', '_'), EXPIRED_AT);
        }
    }

    get EXPIRED_AT (){
        if(this.isMobile()){
            return localStorage.getItem(this._EXPIRED_AT);
        }else{
            return this.cookieService.get(this._EXPIRED_AT.replace(':', '_'));
        }
    }

    set USER_TOKEN ( USER_TOKEN ){
        if(USER_TOKEN == undefined) USER_TOKEN = "";
        if(this.isMobile()){
            localStorage.setItem(this._USER_TOKEN, USER_TOKEN);
        }else{
            this.cookieService.set(this._USER_TOKEN.replace(':', '_'), USER_TOKEN);
        }
    }

    get USER_TOKEN (){
        if(this.isMobile()){
            return localStorage.getItem(this._USER_TOKEN);
        }else{
            return this.cookieService.get(this._USER_TOKEN.replace(':', '_'));
        }
    }


    clearCookies(){
        this.cookieService.deleteAll( this.APP_KEY );
    }

    clearStorage(){
        let whiteList = [this._API_URL];
        let iterableLocalStorage = Object.keys(localStorage);

        whiteList.forEach((whiteItem) => { 
            for (let i = 0; i < iterableLocalStorage.length; i++) {
                if (whiteItem == iterableLocalStorage[i]) {
                    iterableLocalStorage.splice(i,1)
                }
            }
        });
        iterableLocalStorage.forEach((blackItem) => {

            localStorage.removeItem(blackItem);
        })
    }

    clear(){
        if(this.isMobile()){
            this.clearStorage();
        }else{
            this.clearCookies();
        }
    }

    private isMobile(){
        return (this.platform.is('android') || this.platform.is('ios')) 
            && (this.platform.is('tablet') || this.platform.is('mobile'));
    }
}
