import { Injectable, InjectionToken, Inject } from '@angular/core';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { Platform } from '@ionic/angular';
import { Constants } from '../constants';

// Default device info for browser environment
const DEFAULT_DEVICE_INFO = {
  manufacturer: 'browser',
  model: 'browser',
  platform: 'browser',
  version: '1.0.0'
};


// Define an injection token for the device
export const DEVICE_TOKEN = new InjectionToken<typeof Device>('device.token');

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    public wallTabletModels: Array<String> = Constants.WALL_TABLET_MODELS;
    public wallTabletManufacturers: Array<String> = Constants.WALL_TABLET_MANUFACTURERS;

    constructor(
        @Inject(DEVICE_TOKEN) private device: Device,
        private platform: Platform,
    ) {
    }

    public isWallTablet(){
        if(!this.isMobile())
            return false;
            
        const deviceInfo = this.getSafeDeviceInfo();
        
        if(this.wallTabletManufacturers.indexOf(deviceInfo.manufacturer) === -1)
            return false;
        
        if(this.wallTabletModels.indexOf(deviceInfo.model) === -1)
            return false;

        return true;
    }

    private getSafeDeviceInfo() {
        try {
            if (typeof this.device?.manufacturer !== 'undefined') {
                return this.device;
            }
            return DEFAULT_DEVICE_INFO;
        } catch (e) {
            return DEFAULT_DEVICE_INFO;
        }
    }


    public isMobile(){
        return (this.platform.is('android') || this.platform.is('ios')) 
            && (this.platform.is('tablet') || this.platform.is('mobile'));
    }
    
    // Example method using the device
    getDeviceInfo() {
        const deviceInfo = this.getSafeDeviceInfo();
        return {
            model: deviceInfo.model,
            platform: deviceInfo.platform,
            version: deviceInfo.version,
        };
    }

}
