/**
 * @description やることリストから取得した商品の情報
 */
export type TodosItems = {
  itemList: Item[];
};

/**
 * @description やることリストから取得した商品の個別情報
 */
export type Item = {
  id: string;
  name: string;
  thumbnail: string;
};

export interface MonitoringSettings {
  interval: number;
  enabled: boolean;
  showAlert: boolean;
  autoChangeEnabled: boolean;
  waitTime: number;
}

export interface ChromeMessage {
  action: string;
  settings?: MonitoringSettings;
}
