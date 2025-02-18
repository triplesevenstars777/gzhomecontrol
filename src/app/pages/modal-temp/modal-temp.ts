import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from '@ionic/angular';
import { RuleService } from '../../providers/api/rule.service';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-modal-temp',
  templateUrl: 'modal-temp.html',
})
export class ModalTempPage {

  public item: any;
  public enableRule: boolean = false;
  public currentTemp: number;
  public currentTempRange: number;
  public setTemp: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public rulesService: RuleService,
    private viewCtrl: ViewController,
    private translate: TranslateService
  ) {
    this.translate.get('SET_TEMP').subscribe((value) => {
      this.setTemp = value;
    });
  }

  ionViewDidLoad() {
    this.item = this.navParams.get('data');

    this.enableRule = this.item.rule.active;
    this.currentTemp = this.item.rule.source.value;
    this.currentTempRange = this.currentTemp * 10;
  }

  onSliderReleased(ev) {
    this.item.rule.source.value = ev._value / 10;
    this.pushRule(this.item.rule);
  }

  toggleRule() {
    this.item.rule.active = this.enableRule
    this.pushRule(this.item.rule);
  }

  pushRule(rule) {
    this.rulesService.update(this.item.rule._id, rule).subscribe(data => console.log(data))
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
