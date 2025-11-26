import { IpRepository } from "@/repositories/ip";
import { IpStore, ipStore } from "@/stores/ip";

export class IpService {
  #ipRepository: IpRepository;
  #ipStore: IpStore;

  constructor(ipRepository: IpRepository, ipStore: IpStore) {
    this.#ipRepository = ipRepository;
    this.#ipStore = ipStore;
  }

  async initializeUserIp(): Promise<void> {
    this.#ipStore.reset();

    (await this.#ipRepository.getPublicIp())
      .tap((ip) => {
        this.#ipStore.userIp = ip;
      })
      .tapErr((error) => {
        this.#ipStore.error = error.message;
      });

    this.#ipStore.loading = false;
  }
}

export const ipService = new IpService(new IpRepository(), ipStore);
