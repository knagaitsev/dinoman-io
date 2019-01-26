import { Player } from '../../shared/player_pb';
import store from '../store';

function getNewPlayerType() {
    let manCount = 0;
    let ghostCount = 0;
    Object.keys(store.getPlayers).forEach(function (key:any, index:number) {
        if (store.getPlayer(key).getType() == Player.Type.PACMAN) {
            manCount++;
        } else if (store.getPlayer(key).getType() == Player.Type.GHOST) {
            ghostCount++;
        }
    });

    if (ghostCount < manCount) {
        return Player.Type.GHOST;
    } else {
        return Player.Type.PACMAN;
    }
}

export default getNewPlayerType;
