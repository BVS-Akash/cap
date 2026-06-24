using exam.logistics as logistics from '../db/schema';

service LogisticsService @(path: '/logistics') {
    entity Shipments as projection on logistics.Shipments;
    @readonly entity Packages as projection on logistics.Packages;
}