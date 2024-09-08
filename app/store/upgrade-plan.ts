import {create} from "zustand";
import {Product} from "@/app/types/product-vo";


type UpgradePlanStore = {
    upgradeModelVisible: boolean;
    setUpgradeModelVisible: (visible: boolean) => void;
    upgradedProductId?: string;
    setUpgradedProductId: (productId?: string) => void;
    currentUserProductId?: string;
    setCurrentUserProductId: (productId?: string) => void;
    upgradeProducts: Product[];
    setUpgradeProducts: (products: Product[]) => void;
}

export const useUpgradePlanStore = create<UpgradePlanStore>((set, get) => ({
    upgradeModelVisible: false,
    setUpgradeModelVisible: (visible: boolean) => set(() => ({upgradeModelVisible: visible})),
    upgradedProductId: undefined,
    setUpgradedProductId: (productId?: string) => set(() => ({upgradedProductId: productId})),
    currentUserProductId: undefined,
    setCurrentUserProductId: (productId?: string) => set(() => ({currentUserProductId: productId})),
    upgradeProducts: [],
    setUpgradeProducts: (products: Product[]) => set(() => ({upgradeProducts: products})),
    })
)