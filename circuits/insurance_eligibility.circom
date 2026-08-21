pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template AND() {
    signal input a;
    signal input b;
    signal output out;

    out <== a * b;
}

template InsuranceEligibility() {
    signal input ndvi_drop;
    signal input rain_anomaly;
    signal input yield_loss;

    signal output eligible;

    component ndvi_gt = GreaterThan(32);
    ndvi_gt.in[0] <== ndvi_drop;
    ndvi_gt.in[1] <== 3000;

    component rain_gt = GreaterThan(32);
    rain_gt.in[0] <== rain_anomaly;
    rain_gt.in[1] <== 4000;

    component yield_gt = GreaterThan(32);
    yield_gt.in[0] <== yield_loss;
    yield_gt.in[1] <== 2500;

    component and1 = AND();
    and1.a <== ndvi_gt.out;
    and1.b <== rain_gt.out;

    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== yield_gt.out;

    eligible <== and2.out;
}

component main = InsuranceEligibility();
