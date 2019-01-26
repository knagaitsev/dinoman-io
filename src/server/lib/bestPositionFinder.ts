import store from '../store';
import distance from './distance';

function findBestStartingPosition(playerType: any) {
    let furthestDist = -1;
    let bestStart = null;
    let starts = store.getMaze().getTilePositions();
    for (let i = 0; i < starts.length; i++) {
        let start = starts[i];
        let closestPlayerDist = -1;
        Object.keys(store.getPlayers()).forEach(function (uuid:string, index) {
            let player = store.getPlayer(uuid);
            if (playerType != player.getType()) {
                let dist = distance(player, start);
                if (closestPlayerDist == -1 || dist < closestPlayerDist) {
                    closestPlayerDist = dist;
                }
            }
        });

        if (closestPlayerDist > furthestDist) {
            furthestDist = closestPlayerDist;
            bestStart = start;
        }
    }

    if (bestStart === null) {
        bestStart = starts[store.getMaze().getRandomIntInclusive(0, starts.length - 1)];
    }

    return bestStart;
}

export default findBestStartingPosition;
