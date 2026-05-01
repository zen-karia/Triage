export const handler = async (event: any) => {
    event.Records.forEach((record: any) => {
        console.log(record.body);
    });
}