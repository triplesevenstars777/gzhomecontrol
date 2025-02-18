
import {
    Directive,
    OnDestroy,
    Output,
    EventEmitter,
    HostListener
  } from "@angular/core";
  
  @Directive({
    selector: "[doubletap]"
  })
  export class DoubletapDirective implements OnDestroy {

    private waitingSecondClick: boolean;
    private firstClickTime: any;
    private clickingTimeout: any;
    private TIME_INTERVAL = 500;

    @Output() public ondoubletap: EventEmitter<Event> = new EventEmitter();
  
    constructor() {}
    
    @HostListener('click', ['$event'])
    dblTapHandler( event ){
        
        if (!this.waitingSecondClick) {
            
            this.firstClickTime = (new Date()).getTime();
            this.waitingSecondClick = true;

            this.clickingTimeout = setTimeout(function () {
                this.waitingSecondClick = false;
            }, this.TIME_INTERVAL);
        }
        else {
            this.waitingSecondClick = false;
    
            var time = (new Date()).getTime();
            if (time - this.firstClickTime < this.TIME_INTERVAL) {
                clearTimeout(this.clickingTimeout);
                this.ondoubletap.emit(event);
            }
        }
    }
    // clean things up
    public ngOnDestroy() {
        if(this.clickingTimeout){
            clearTimeout(this.clickingTimeout);
        }
    }
}


  


