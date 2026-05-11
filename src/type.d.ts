declare interface Window {
  buff_v1_startGameTms: number
  buff_v2_serverStartGameTs: number
  buff_v3_dealyTs: number
  buff_f1_startGameSession: () => Promise<void>
  buff_f2_submitScore: () => Promise<void>
}
