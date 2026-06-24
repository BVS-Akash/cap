namespace exam.logistics;

type TransportMode : String enum {
    Sea = 'S';
    Air = 'A';
    Rail = 'R';
}

entity Shipments {
    key ID          : UUID;
        customer    : String;
        mode        : TransportMode;
        packages    : Composition of many Packages on packages.parent = $self;
        virtual totalWeight : Decimal(10,2);
        virtual shippingFee : Decimal(10,2);
}

entity Packages {
    key ID       : UUID;
        contents : String;
        weight   : Decimal(10,2);
        parent   : Association to Shipments;
}