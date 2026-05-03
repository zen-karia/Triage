export const handler = async (event : any) => {
    console.log('Fulfilling the required Order', event);
    return event;
}