import { Result } from "@/lib/utils";

class IpRepository {
  async getPublicIp(): Promise<Result<string, Error>> {
    return Result.fromPromise<string, Error>(
      fetch("https://api.ipify.org?format=json")
        .then((res) =>
          res.ok
            ? res.json()
            : Promise.reject(new Error(`Http error! status: ${res.status}`))
        )
        .then((data: { ip: string }) => data.ip)
    );
  }
}

export { IpRepository };
