import {create} from "zustand";
import {FunctionPlugin} from "@/app/types/plugins";
import {PluginsApi} from "@/app/client/plugins";


const pluginsService = new PluginsApi();

type PluginsStore = {
    supportedFunctions: FunctionPlugin[];
    initSupportedFunctions: () => Promise<void>;
    findPluginById(id: string): FunctionPlugin | undefined;
    findPluginByIdList: (ids: string[]) => FunctionPlugin[] | undefined;
}

export const usePluginsStore = create<PluginsStore>((set, get) => ({
    supportedFunctions: [],

    async initSupportedFunctions() {
        let supportedPlugins = await pluginsService.getSupportedFunctions();
        supportedPlugins = supportedPlugins.filter(plugin => plugin.status > 0);
        set(() => ({
            supportedFunctions: supportedPlugins,
        }));
    },
    findPluginById(id: string) {
        return get().supportedFunctions.find(plugin => plugin.id === id);
    },
    findPluginByIdList(ids: string[]) {
        if (!ids || ids.length === 0) {
            return undefined;
        }
        let plugins = get().supportedFunctions.filter(plugin => ids.includes(plugin.id));
        return plugins.length > 0 ? plugins : undefined;
    }

}))


