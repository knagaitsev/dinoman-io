import { PlayerServiceServer } from '../../../shared/service_rsocket_pb';

import { Player } from '../../../shared/player_pb';
import { Location } from '../../../shared/location_pb';
import { Extra } from '../../../shared/extra_pb';
import { playersProcessor, powerProcessor, foodProcessor } from '../processors';
import store from '../../store';

const playerService = new PlayerServiceServer({
    locate(location: Location, uuid: string) {
        const time = Date.now();
        const player = store.getPlayer(uuid);
        let dt = time - player.getTimestamp();

        player.setTimestamp(time);
        player.setState(Player.State.ACTIVE);
        player.setLocation(location);

        let collisionData = store.getMaze().collideFood(location.getPosition().getX(), location.getPosition().getY());
        if (collisionData) {
            if (collisionData.type == 1) {
                player.setScore(player.getScore() + 1);
                // sockets[uuid].emit("score", players[uuid].score);


            } else if (collisionData.type == 2) {
                let sec = 10;
                store.setPowerUpEnd(Date.now() + sec * 1000);
            }
            let addedFood = store.getMaze().addFood(Object.keys(store.getPlayers()).length);
            
            const extra = new Extra();

            extra.setLast(collisionData.flattenPosition);
            extra.setCurrent(addedFood.flattenPosition);

            if (addedFood.type == 1) {
                console.log("sent food");
                foodProcessor.onNext(extra);
            } else {
                console.log("sent power");
                powerProcessor.onNext(extra);
            }
            // sockets[uuid].emit("food", {newFood});
            // sockets[uuid].broadcast.emit("food", newFood);
        }
        playersProcessor.onNext(player);
    },

    players() {
        return playersProcessor;
    }

})

export default playerService;
