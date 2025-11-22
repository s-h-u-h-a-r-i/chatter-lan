import { IpRepository } from "@/repositories/ip";
import { ipStore } from "@/stores/ip";

export class IpService {
  #ipRepository: IpRepository;

  constructor() {
    this.#ipRepository = new IpRepository();
  }

  async initializeUserIp(): Promise<void> {
    ipStore.reset();

    (await this.#ipRepository.getPublicIp())
      .tap((ip) => {
        ipStore.userIp = ip;
      })
      .tapErr((error) => {
        ipStore.error = error.message;
      });

    ipStore.loading = false;
  }
}

export const ipService = new IpService();
