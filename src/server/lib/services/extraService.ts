import { ExtraServiceServer } from '../../../shared/service_rsocket_pb';
import { foodProcessor, powerProcessor } from '../processors';


const extraService = new ExtraServiceServer({
    food() {
        return foodProcessor;
    },

    power() {
        return powerProcessor;
    }
});

export default extraService;
